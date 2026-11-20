import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Gamepad2, Star } from 'lucide-react';
import { type Game, publicImage } from '@/lib/catalog';
import { money } from '@/lib/rules';
import { GameplayPreview } from './gameplay-preview';
import { CardMotion } from './card-motion';

export function GameCard({game,preview,index=0,tilt=false}: {game:Game;preview?:string;index?:number;tilt?:boolean}) {
  const image=publicImage(game.cover_url || game.banner_url);
  if (!game.slug) return null;
  return <CardMotion index={index} tilt={tilt}><Link href={'/game/'+encodeURIComponent(game.slug)} className="game-card-link">
    <div className="game-cover">{image ? <Image src={image} alt="" fill sizes="(max-width:600px) 50vw, (max-width:1100px) 33vw, 25vw"/> : <Gamepad2 size={34} aria-hidden/>}</div>
    <div className="game-card-text">
      <span className="muted">{game.genre || 'Jogo'}</span><h3>{game.title}</h3>
      <div className="game-card-meta"><span>{game.price===0?'Gratuito':money.format(game.price)}</span>
        {game.rating_average!=null && <span className="rating"><Star size={14}/>{Number(game.rating_average).toFixed(1).replace('.',',')}</span>}<ArrowUpRight className="card-arrow" size={18} aria-hidden/></div>
    </div>
  </Link>{preview&&<GameplayPreview url={preview}/>}</CardMotion>;
}
