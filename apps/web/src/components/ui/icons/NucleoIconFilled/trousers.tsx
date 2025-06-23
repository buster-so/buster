import type { iconProps } from './iconProps';

function trousers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trousers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7.5 1H10.5V3.5H7.5z" fill="currentColor" />
        <path d="M12,3.5h3v-.75c0-.965-.785-1.75-1.75-1.75h-1.25V3.5Z" fill="currentColor" />
        <path d="M6,3.5V1h-1.25c-.965,0-1.75,.785-1.75,1.75v.75h3Z" fill="currentColor" />
        <path
          d="M14.75,9.25c-2.288,0-3.026-2.173-3.057-2.266-.129-.394,.086-.817,.479-.946,.392-.13,.813,.084,.944,.474,.02,.057,.444,1.238,1.633,1.238h.397l-.115-2.75H2.968l-.115,2.75h.396c1.213,0,1.627-1.221,1.631-1.233,.129-.394,.554-.608,.946-.479,.394,.129,.608,.553,.479,.946-.03,.093-.769,2.266-3.057,2.266h-.459l-.247,5.928c-.021,.48,.152,.937,.485,1.284s.782,.539,1.264,.539h1.847c.872,0,1.6-.625,1.73-1.488l1.009-6.659c.02-.12,.223-.121,.242,0l1.009,6.659c.131,.862,.858,1.487,1.73,1.487h1.847c.481,0,.931-.191,1.264-.539s.506-.803,.485-1.284l-.247-5.927h-.459Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default trousers;
