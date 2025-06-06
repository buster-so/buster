import type { iconProps } from './iconProps';

function databaseMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px database minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.021,15.219c-.332,.021-.672,.031-1.021,.031-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v1.329c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.25c0-1.97-3.521-3-7-3S2,2.28,2,4.25V13.75c0,1.97,3.521,3,7,3,.379,0,.751-.012,1.113-.034,.414-.025,.728-.381,.702-.795-.025-.413-.364-.73-.795-.702Zm-1.021-4.719c-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v2.829c0,.436-1.927,1.5-5.5,1.5Z"
          fill="currentColor"
        />
        <path
          d="M17.25,14h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default databaseMinus;
