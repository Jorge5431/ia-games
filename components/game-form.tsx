'use client';
import {useState} from 'react';
import {type Game} from '@/lib/catalog';
import {categories} from '@/lib/rules';
import {saveGame} from '@/lib/portal-actions';
import {ActionForm} from './action-form';
export function GameForm({game,canSubmit=false}:{game?:Game;canSubmit?:boolean}){
 const [title,setTitle]=useState(game?.title??'');
 const [genre,setGenre]=useState(game?.genre??'Indie');
 const [description,setDescription]=useState(game?.description??'');
 return <div className="publication-editor"><div className="panel"><h2>Informações do jogo</h2><ActionForm action={saveGame.bind(null,game?.id??null)} label="Salvar rascunho"><label className="field">Título<input name="title" required minLength={2} maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field">Gênero<select name="genre" value={genre} onChange={e=>setGenre(e.target.value)}>{categories.map(([,g])=><option key={g}>{g}</option>)}</select></label><label className="field">Descrição do jogo<textarea name="description" required maxLength={15000} rows={6} value={description} onChange={e=>setDescription(e.target.value)}/></label>{canSubmit&&<button type="submit" name="intent" value="submit" className="button">Salvar e enviar para análise</button>}</ActionForm></div><aside className="publication-preview"><p className="eyebrow">Prévia</p><div className="publication-banner" style={game?.banner_url||game?.cover_url?{backgroundImage:"linear-gradient(0deg,#080808,transparent),url("+JSON.stringify(game.banner_url||game.cover_url)+")"}:undefined}><h3>{title||'Título do jogo'}</h3><p>{description.slice(0,240)||'Sua descrição aparecerá aqui.'}</p></div><p className="muted">{genre} · Gratuito</p><p>Envie o arquivo ou link do jogo. Depois, salve e envie para análise neste formulário.</p></aside></div>;
}
