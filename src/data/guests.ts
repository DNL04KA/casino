import type { GuestId } from '@/types';

/**
 * The collection at the heart of the house.
 *
 * A spirit is served the moment its symbol takes part in a win. It then keeps
 * its seat and lends the room a standing favour, so the board a player is
 * looking at is shaped by everyone they have already served — not just by the
 * last spin. Fill all four seats and the road comes in for the Midnight
 * Service.
 */
export interface GuestFavour {
  id: GuestId;
  /** Symbol id is the same as the guest id, so the art comes for free. */
  name: string;
  seat: string;
  favour: string;
  detail: string;
  color: string;
}

export const GUEST_ORDER: GuestId[] = ['kasa', 'kitsune', 'okami', 'tanuki'];

export const GUEST_FAVOURS: Record<GuestId, GuestFavour> = {
  kasa: {
    id: 'kasa',
    name: 'Karakasa',
    seat: 'Corner table',
    favour: 'Shelter',
    detail: 'Every koban opens across its whole reel.',
    color: '#F8A65B',
  },
  kitsune: {
    id: 'kitsune',
    name: 'Yuzuha',
    seat: 'By the window',
    favour: 'Foxfire',
    detail: 'Sealed ofuda fall far more often.',
    color: '#6BE3C0',
  },
  okami: {
    id: 'okami',
    name: 'The Okami',
    seat: 'Behind the counter',
    favour: 'On the house',
    detail: 'The house adds a tenth to every demo win.',
    color: '#B58CFF',
  },
  tanuki: {
    id: 'tanuki',
    name: 'Bunzo',
    seat: 'Nearest the pot',
    favour: 'Lucky purse',
    detail: 'Adds +1 to the round multiplier.',
    color: '#F8C65B',
  },
};

export const EMPTY_TABLE: Record<GuestId, boolean> = {
  kasa: false,
  kitsune: false,
  okami: false,
  tanuki: false,
};
