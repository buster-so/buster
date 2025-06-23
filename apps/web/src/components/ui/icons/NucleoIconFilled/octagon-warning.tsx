import type { iconProps } from './iconProps';

function octagonWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px octagon warning';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.694,5.088l-2.782-2.782c-.52-.52-1.21-.806-1.945-.806h-3.935c-.735,0-1.425,.286-1.945,.806l-2.782,2.782c-.52,.52-.806,1.21-.806,1.945v3.935c0,.735,.286,1.425,.806,1.945l2.782,2.782c.52,.52,1.21,.806,1.945,.806h3.935c.735,0,1.425-.286,1.945-.806l2.782-2.782c.52-.52,.806-1.21,.806-1.945v-3.935c0-.735-.286-1.425-.806-1.945Zm-7.444,.343c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.139c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5.431Zm.75,7.986c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default octagonWarning;
