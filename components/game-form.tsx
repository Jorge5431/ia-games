import { type Game } from '@/lib/catalog';
import { categories, platforms } from '@/lib/rules';
import { saveGame } from '@/lib/portal-actions';
import { ActionForm, Field, Notes } from './action-form';

export function GameForm({game}: {game?:Game}) {
  return <div className="panel"><ActionForm action={saveGame.bind(null,game?.id ?? null)} label="Salvar rascunho">
    <div className="form-grid">
      <Field name="title" label="Título" value={game?.title} min={2} max={100} required/>
      <Field name="slug" label="Endereço do jogo" value={game?.slug} min={2} max={100} required/>
      <Field type="number" name="price" label="Preço em reais" value={game?.price ?? 0} min={0} required/>
      <label className="field">Gênero<select name="genre" defaultValue={game?.genre ?? 'Indie'}>{categories.map(([,genre])=><option key={genre}>{genre}</option>)}</select></label>
      <Field type="date" name="release_date" label="Data de lançamento" value={game?.release_date}/>
      <Field name="languages" label="Idiomas separados por vírgula" value={game?.languages?.join(', ')} max={200}/>
    </div>
    <div className="stack"><p>Plataformas</p><div className="toolbar">{platforms.map(platform=><label key={platform} className="check"><input type="checkbox" name="platform" value={platform} defaultChecked={game?.platform?.includes(platform)}/>{platform}</label>)}</div></div>
    <Field name="short_description" label="Descrição curta" value={game?.short_description} max={240}/>
    <Notes name="description" label="Descrição completa" value={game?.description} maxLength={15000}/>
    <Notes name="minimum_requirements" label="Requisitos mínimos do sistema" value={game?.minimum_requirements} maxLength={4000}/>
    <Notes name="recommended_requirements" label="Requisitos recomendados" value={game?.recommended_requirements} maxLength={4000}/>
    <Notes name="ai_disclosure" label="Declaração do uso de IA" value={game?.ai_disclosure} maxLength={4000}/>
  </ActionForm></div>;
}
