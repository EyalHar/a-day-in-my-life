import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDay } from '../api/days';

export function useDay(date) {
  return useQuery({
    queryKey: ['day', date],
    queryFn: () => getDay(date),
    enabled: !!date,
  });
}

export function useInvalidateDay() {
  const queryClient = useQueryClient();
  return (date) => queryClient.invalidateQueries({ queryKey: ['day', date] });
}
