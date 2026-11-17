export default function Loading() {
  return <section className="container page" aria-label="Carregando conteúdo" aria-busy="true"><div className="skeleton"/><div className="card-grid">{Array.from({length:4},(_,index)=><div key={index} className="skeleton"/>)}</div></section>;
}
