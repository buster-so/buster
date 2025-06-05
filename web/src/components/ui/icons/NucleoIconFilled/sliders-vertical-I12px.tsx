import type { iconProps } from './iconProps';

function slidersVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sliders vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,11c0-1.394-.96-2.558-2.25-2.894V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.356c-1.29,.335-2.25,1.5-2.25,2.894s.96,2.558,2.25,2.894v2.356c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.356c1.29-.335,2.25-1.5,2.25-2.894Z"
          fill="currentColor"
        />
        <path
          d="M6,4.106V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.356c-1.29,.335-2.25,1.5-2.25,2.894s.96,2.558,2.25,2.894v6.356c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.356c1.29-.335,2.25-1.5,2.25-2.894s-.96-2.558-2.25-2.894Zm-.75,4.394c-.827,0-1.5-.673-1.5-1.5s.673-1.5,1.5-1.5,1.5,.673,1.5,1.5-.673,1.5-1.5,1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default slidersVertical;
