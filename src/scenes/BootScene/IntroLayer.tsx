import '../../styles/intro.css';

const MIEMBROS: ReadonlyArray<readonly [string, string]> = [
  ['95763', 'Bocek, Bruno'],
  ['401675', 'Díaz, Lautaro Nicolás'],
  ['407594', 'Díaz Nievas, Fabricio'],
  ['400476', 'Farfán, Gonzalo'],
  ['409247', 'Lamazón, Violeta'],
  ['409518', 'Oberto, Oliver'],
  ['81994', 'Pino Videla, Carlos Emanuel'],
];

export function IntroLayer() {
  return (
    <div className='intro-layer'>
      <p className='intro-uni'>UNIVERSIDAD TECNOLÓGICA NACIONAL</p>
      <p className='intro-fac'>FACULTAD REGIONAL CÓRDOBA</p>
      <p className='intro-cat'>Diseño de Sistemas de Información</p>
      <div className='intro-sep' />
      <p className='intro-group'>GRUPO G08</p>
      <p className='intro-label'>INTEGRANTES</p>
      <ul className='intro-list'>
        {MIEMBROS.map(([l, n]) => (
          <li className='intro-row' key={l}>
            <b>{l}</b>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
