<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VesselPlanOverride extends Model
{
    protected $primaryKey = 'ob_ib_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];
}
