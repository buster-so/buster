import type { iconProps } from './iconProps';

function graduationCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px graduation cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.488,12.39c-.459,.236-.974,.36-1.488,.36s-1.031-.125-1.489-.361l-4.011-2.064v3.676c0,1.805,2.767,2.75,5.5,2.75s5.5-.945,5.5-2.75v-3.676l-4.012,2.065Z"
          fill="currentColor"
        />
        <path
          d="M16.719,9.226c-.026-.806,.056-1.611,.216-2.402,.018-.13,.065-.191,.065-.449,0-.601-.332-1.146-.866-1.421L9.802,1.694c-.502-.259-1.102-.258-1.604,0L1.866,4.955c-.534,.275-.866,.819-.866,1.42s.332,1.146,.866,1.421l6.332,3.259c.251,.129,.526,.194,.802,.194s.551-.065,.802-.194l5.451-2.806c-.019,.341-.045,.682-.034,1.024,.024,.772,.126,1.546,.301,2.301,.08,.347,.389,.581,.729,.581,.057,0,.113-.006,.17-.02,.403-.093,.655-.496,.562-.899-.152-.66-.241-1.336-.262-2.011Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default graduationCap;
