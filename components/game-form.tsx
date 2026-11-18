'use client';
import Image from 'next/image';
import {useState} from 'react';
import { type Game } from '@/lib/catalog';
import { categories, platforms } from '@/lib/rules';
import { saveGame } from '@/lib/portal-actions';
import { ActionForm, Field, Notes } from './action-form';

export function GameForm({game}: {game?:Game}) {
  const [title,setTitle]=useState(game?.title||'');
  const [slugValue,setSlugValue]=useState(game?.slug||'');
  const [price,setPrice]=useState(String(game?.price??0));
  const [summary,setSummary]=useState(game?.short_description||'');
  const [genre,setGenre]=useState(game?.genre||'Indie');
  return <div className="publication-editor"><div className="panel"><h2>1. Informações do jogo</h2><p className="muted">Salve o rascunho para desbloquear a etapa de mídias e a revisão.</p><ActionForm action={saveGame.bind(null,game?.id ?? null)} label="Salvar rascunho">
    <div className="form-grid">
      <label className="field">Título<input name="title" value={title} onChange={e=>{setTitle(e.target.value);if(!game)setSlugValue(e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100))}} minLength={2} maxLength={100} required/></label>
      <label className="field">Endereço do jogo<input name="slug" value={slugValue} onChange={e=>setSlugValue(e.target.value)} minLength={2} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" required/><small>/game/{slugValue||"meu-jogo"}</small></label>
      <label className="field">Preço em reais (0 = gratuito)<input type="number" name="price" value={price} onChange={e=>setPrice(e.target.value)} min={0} step=".01" required/></label>
      <label className="field">Gênero<select name="genre" value={genre} onChange={e=>setGenre(e.target.value)}>{categories.map(([,genre])=><option key={genre}>{genre}</option>)}</select></label>
      <Field type="date" name="release_date" label="Data de lançamento" value={game?.release_date}/>
      <Field name="languages" label="Idiomas separados por vírgula" value={game?.languages?.join(', ')} max={200}/>
    </div>
    <div className="stack"><p>Plataformas</p><div className="toolbar">{platforms.map(platform=><label key={platform} className="check"><input type="checkbox" name="platform" value={platform} defaultChecked={game?.platform?.includes(platform)}/>{platform}</label>)}</div></div>
    <label className="field">Descrição curta<input name="short_description" value={summary} onChange={e=>setSummary(e.target.value)} maxLength={240}/><small>{summary.length}/240 caracteres</small></label>
    <Notes name="description" label="Descrição completa" value={game?.description} maxLength={15000}/>
    <Notes name="minimum_requirements" label="Requisitos mínimos do sistema" value={game?.minimum_requirements} maxLength={4000}/>
    <Notes name="recommended_requirements" label="Requisitos recomendados" value={game?.recommended_requirements} maxLength={4000}/>
    <Notes name="ai_disclosure" label="Declaração do uso de IA" value={game?.ai_disclosure} maxLength={4000}/>
  </ActionForm></div><aside className="publication-preview"><p className="eyebrow">Prévia ao vivo · não publicada</p><h2>Seu jogo na loja</h2><article className="game-card"><div className="game-cover">{game?.cover_url?<Image src={game.cover_url} alt="Capa atual" fill sizes="400px"/>:<span>Adicione a capa na etapa 2</span>}</div><div className="game-card-text"><span className="muted">{genre}</span><h3>{title||"Título do jogo"}</h3><p>{Number(price)>0?Number(price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"Gratuito"}</p></div></article><h3>Página do jogo</h3><div className="publication-banner" style={game?.banner_url?{backgroundImage:"linear-gradient(0deg,#080808,transparent),url("+JSON.stringify(game.banner_url)+")"}:undefined}><h3>{title||"Título do jogo"}</h3><p>{summary||"Sua descrição aparecerá aqui."}</p></div><p className="muted">2. Mídias · 3. Revisão e envio. Arquivos executáveis e pagamentos reais ainda não estão habilitados.</p></aside></div>;
}
