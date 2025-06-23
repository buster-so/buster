import type { iconProps } from './iconProps';

function dropdownList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dropdown list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,5H3.75c-1.24,0-2.25,1.009-2.25,2.25v2c0,1.241,1.01,2.25,2.25,2.25h4.819c-.159-.814,.065-1.65,.67-2.256,.092-.092,.194-.168,.296-.244H5.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75,0,.213-.09,.402-.233,.539l3.117,1.139c.069-.215,.116-.44,.116-.678v-2c0-1.241-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M9.064,14.5h-3.814c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.814c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,3.5H5.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.324,12.233l-5.94-2.17h0c-.379-.139-.795-.047-1.082,.24-.286,.287-.377,.702-.237,1.081l2.17,5.941c.149,.406,.536,.675,.967,.675h.022c.439-.01,.825-.297,.958-.716l.753-2.351,2.352-.752c.419-.134,.706-.52,.715-.96s-.264-.837-.676-.988Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dropdownList;
