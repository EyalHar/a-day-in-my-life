import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getRecipes } from '../../api/recipes';
import { deleteEntry } from '../../api/entries';
import EntryBlock from '../../components/EntryBlock/EntryBlock';
import styles from './RecipesPage.module.css';

export default function RecipesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['recipes'], queryFn: getRecipes });
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span>🍲</span>
        <span>מתכונים</span>
      </h1>

      {isLoading ? (
        <p>טוען...</p>
      ) : data.recipes.length === 0 ? (
        <div className={styles.empty}>עדיין אין מתכונים שמורים. הוסיפו אחד מדף היום.</div>
      ) : (
        data.recipes.map((recipe) => (
          <div key={recipe.id}>
            <Link to={`/day/${recipe.date}`} className={styles.dateLabel}>
              {format(new Date(`${recipe.date}T00:00:00`), 'd בMMMM yyyy', { locale: he })}
            </Link>
            <EntryBlock entry={recipe} onDelete={(id) => deleteMutation.mutate(id)} />
          </div>
        ))
      )}
    </div>
  );
}
