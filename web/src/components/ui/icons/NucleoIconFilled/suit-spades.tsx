import type { iconProps } from './iconProps';

function suitSpades(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suit spades';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.905,15.516c-2.001-.423-4.155-2.095-4.155-4.766,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,2.671-2.154,4.343-4.155,4.766-.375,.08-.63,.43-.591,.812,.04,.382,.362,.672,.746,.672H13.75c.384,0,.706-.29,.746-.672,.04-.382-.215-.732-.591-.812Z"
          fill="currentColor"
        />
        <path
          d="M12.451,5.522c-1.328-1.03-2.701-2.095-2.701-3.772,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,1.677-1.373,2.742-2.701,3.772-.491,.381-.955,.741-1.337,1.125-.955,.96-1.487,2.14-1.461,3.237,.021,.872,.379,1.651,1.037,2.254,.617,.565,1.366,.861,2.175,.861,.054,0,.109-.001,.164-.004,.972-.047,1.972-.509,2.873-1.316,.901,.807,1.901,1.269,2.873,1.316,.873,.039,1.681-.254,2.339-.857,.658-.603,1.016-1.382,1.037-2.254,.025-1.097-.507-2.277-1.461-3.237-.382-.385-.846-.745-1.337-1.125Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitSpades;
