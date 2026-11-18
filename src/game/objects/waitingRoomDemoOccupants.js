import {
    getSitDirectionForBenchSlot,
    PLAYER_BENCH_SEAT_INDEX,
    PLAYER_BENCH_SLOT_INDEX,
    SHEEP_SEATS_PER_BENCH,
    WAITING_ROOM_BENCH_SLOTS
} from './waitingRoomBenches';

const DEMO_TICKET_ID_BASE = 9200;
const DEMO_TICKET_NUMBER_BASE = 101;

export function buildWaitingRoomDemoOccupants ()
{
    const occupants = [];
    let ticketId = DEMO_TICKET_ID_BASE;
    let ticketNumber = DEMO_TICKET_NUMBER_BASE;

    WAITING_ROOM_BENCH_SLOTS.forEach((slot, benchSlotIndex) =>
    {
        for (let seatIndex = 0; seatIndex < SHEEP_SEATS_PER_BENCH; seatIndex += 1)
        {
            if (benchSlotIndex === PLAYER_BENCH_SLOT_INDEX && seatIndex === PLAYER_BENCH_SEAT_INDEX)
            {
                continue;
            }

            occupants.push({
                benchSlotIndex,
                seatIndex,
                sitDirection: getSitDirectionForBenchSlot(slot),
                ticketId,
                ticketNumber
            });

            ticketId += 1;
            ticketNumber += 1;
        }
    });

    return occupants;
}

export const WAITING_ROOM_DEMO_OCCUPANTS = buildWaitingRoomDemoOccupants();