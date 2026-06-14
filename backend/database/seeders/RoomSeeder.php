<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [
            ['name' => 'Alpha', 'capacity' => 4],
            ['name' => 'Bravo', 'capacity' => 8],
            ['name' => 'Charlie', 'capacity' => 12],
            ['name' => 'Boardroom', 'capacity' => 20],
        ];

        foreach ($rooms as $room) {
            Room::query()->updateOrCreate(['name' => $room['name']], $room);
        }
    }
}
