<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaginateController extends Controller
{
    public const DEFAULT_PER_PAGE = 10;
    public const MIN_PER_PAGE = 1;
    public const MAX_PER_PAGE = 100;
    public function getPerPage(Request $request, int $default = self::DEFAULT_PER_PAGE, int $max = self::MAX_PER_PAGE, int $min = self::MIN_PER_PAGE): int
    {
        return min(max((int) $request->query('per_page', $default), $min), $max);
    }
}
