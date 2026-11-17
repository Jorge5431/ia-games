import { ActionForm, Notes } from './action-form';
import { deleteReview, saveReview } from '@/lib/player-actions';

export type Review = {id:string;rating:number;comment:string|null;created_at:string;user_id?:string};

export function ReviewForm({gameId,review,path}: {gameId:string;review?:Review;path:string}) {
  return <div className="stack">
    <ActionForm action={saveReview.bind(null,gameId,review?.id ?? null,path)} label={review?'Editar avaliação':'Publicar avaliação'}>
      <label className="field">Nota<select name="rating" defaultValue={review?.rating ?? 5}>{[1,2,3,4,5].map(star=><option key={star} value={star}>{star} {star===1?'estrela':'estrelas'}</option>)}</select></label>
      <Notes name="comment" label="Comentário" value={review?.comment}/>
    </ActionForm>
    {review && <ActionForm action={deleteReview.bind(null,review.id,path)} label="Excluir avaliação" secondary/>}
  </div>;
}
