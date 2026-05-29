# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — PHP base
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.4-fpm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    git \
    libonig-dev \
    libldap2-dev \
    libxml2-dev \
    gnupg2 \
    apt-transport-https \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Microsoft ODBC Driver 18 (required by sqlsrv PHP extension)
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install -j$(nproc) \
        bcmath \
        ctype \
        fileinfo \
        mbstring \
        opcache \
        pdo \
        pdo_mysql \
        xml \
        ldap

# sqlsrv via PECL (needs ODBC driver installed above)
RUN pecl install sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY .docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /var/www/html

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Dev image
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS development

EXPOSE 9000
CMD ["php-fpm"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS node-builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY resources/ resources/
COPY vite.config.js ./
COPY public/ public/
RUN npm run build

FROM base AS production

COPY --chown=www-data:www-data . .
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts
COPY --from=node-builder --chown=www-data:www-data /app/public/build ./public/build
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
