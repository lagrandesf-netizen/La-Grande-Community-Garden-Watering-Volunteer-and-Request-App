export const PLOT_ITEMS: string[] = [
  '2',
  '3A', '3B',
  '4A', '4B',
  '5A', '5B',
  '6A', '6B',
  '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25',
  '26A', '26B',
  '27', '28', '29',
  '30A', '30B',
  '31A', '31B',
  '32A', '32B',
  '33A', '33B',
  '34',
  '35A', '35B',
  '36A', '36B',
  '37A', '37B',
  '38A', '38B',
  '39A', '39B',
  '40A', '40B',
  '41',
  '42',
  '43',
  'Herbs',
  'Apple Tree Area',
  'Flowers'
];

export const ALPHABETIZED_PLOTS: string[] = [...PLOT_ITEMS].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
);

export interface ItemState {
  id: string;
  checked: boolean;
  checkedAt?: string | null;
  checkedBy?: string | null;
  watered: boolean;
  wateredAt?: string | null;
  wateredBy?: string | null;
}

export interface AppState {
  available: boolean;
  activeVolunteerPlot?: string | null;
  items: Record<string, ItemState>;
  leaderPin: string;
  title: string;
  lastUpdated: string;
  lastNightlyReset?: string | null;
  lastNightlyResetDateKey?: string | null;
  notice?: string;
}
