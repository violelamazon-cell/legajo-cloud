import '../../styles/closing.css';

export function ClosingLayer() {
  return (
    <div className='close-layer'>
      <h2 className='close-title'>GRACIAS.</h2>
      <p className='close-sub'>MIGRACIÓN COMPLETADA CON ÉXITO</p>
      <div className='close-refs'>
        <p className='close-refs-title'>REFERENCIAS BIBLIOGRÁFICAS</p>
        <ol>
          <li><span>1.</span> <a href='https://uv.frc.utn.edu.ar/pluginfile.php/1250028/mod_folder/content/0/Managed%20SW%20Evolution.pdf?forcedownload=1' target='_blank' rel='noopener noreferrer'>Managed SW Evolution</a></li>
          <li><span>2.</span> <a href='https://uv.frc.utn.edu.ar/pluginfile.php/1250028/mod_folder/content/0/software-evolution-and-maintenance.pdf?forcedownload=1' target='_blank' rel='noopener noreferrer'>Software Evolution and Maintenance</a></li>
          <li><span>3.</span> <a href='https://uv.frc.utn.edu.ar/pluginfile.php/1250028/mod_folder/content/0/working-effectively-with-legacy-code-14th-printingnbsped-0131177052-9780131177055_compress.pdf?forcedownload=1' target='_blank' rel='noopener noreferrer'>Working Effectively with Legacy Code</a></li>
        </ol>
      </div>
    </div>
  );
}
