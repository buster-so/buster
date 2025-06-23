import type { iconProps } from './iconProps';

function bagShopping2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag shopping 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.749,13.446l-1.056-9.5c-.155-1.395-1.331-2.446-2.733-2.446H5.04c-1.403,0-2.578,1.052-2.733,2.446L1.251,13.447c-.086,.776,.164,1.556,.685,2.138,.521,.582,1.268,.916,2.049,.916H14.016c.781,0,1.528-.334,2.049-.916,.521-.582,.771-1.361,.685-2.138Zm-7.749-4.696c-1.93,0-3.5-1.57-3.5-3.5,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,1.103,.897,2,2,2s2-.897,2-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,1.93-1.57,3.5-3.5,3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagShopping2;
