export default function HomeLoading() {
  return <div role="status" className="home immersive-home" aria-busy="true" aria-label="Carregando página inicial">
    <section className="immersive-hero" aria-hidden="true">
      <div className="immersive-art"><div className="immersive-art-image"/></div>
      <div className="immersive-fade"/>
    </section>
  </div>;
}
