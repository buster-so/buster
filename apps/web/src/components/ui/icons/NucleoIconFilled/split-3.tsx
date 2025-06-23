import type { iconProps } from './iconProps';

function split3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px split 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.942,2.463c-.076-.183-.222-.329-.405-.406-.092-.038-.189-.058-.287-.058h-4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.439l-3.22,3.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.22-3.22v2.439c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.098-.02-.195-.058-.287Z"
          fill="currentColor"
        />
        <path
          d="M4.561,3.5h2.439c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.439l4.384,4.384c.236,.236,.366,.55,.366,.884v6.421c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.421c0-.735-.286-1.425-.806-1.945L4.561,3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default split3;
