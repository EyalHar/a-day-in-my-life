import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearDayCover, getDay, setDayCover } from '../api/days';

export function useDay(date) {
  return useQuery({
    queryKey: ['day', date],
    queryFn: () => getDay(date),
    enabled: !!date,
  });
}

export function useDayCover(date) {
  const queryClient = useQueryClient();
  const { data } = useDay(date);
  const mutation = useMutation({
    mutationFn: (photoId) => (photoId ? setDayCover(date, photoId) : clearDayCover(date)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['day', date] }),
  });

  const coverPhotoId = data?.cover?.photoId ?? null;
  return {
    coverPhotoId,
    toggleCover: (photoId) => mutation.mutate(coverPhotoId === photoId ? null : photoId),
    clearCover: () => mutation.mutate(null),
  };
}

export function useInvalidateDay() {
  const queryClient = useQueryClient();
  return (date) => queryClient.invalidateQueries({ queryKey: ['day', date] });
}
