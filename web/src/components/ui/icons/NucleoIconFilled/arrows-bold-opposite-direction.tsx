import type { iconProps } from './iconProps';

function arrowsBoldOppositeDirection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows bold opposite direction';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.539,7L5.5,2.866v1.884c0,.414,.336,.75,.75,.75h3.4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.65v-1.756c0-.513-.308-.968-.783-1.159-.474-.19-1.013-.077-1.37,.294L.401,6.02c-.527,.55-.527,1.411,0,1.961l2.308,2.408c.147,.154,.345,.231,.542,.231,.187,0,.374-.069,.519-.208,.3-.287,.31-.761,.023-1.061L1.539,7Z"
          fill="currentColor"
        />
        <path
          d="M17.6,10.02l-4.446-4.64s0,0,0,0c-.357-.37-.895-.486-1.369-.294-.476,.191-.783,.646-.783,1.159v1.756H6.75c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h4.25v1.756c0,.513,.308,.968,.783,1.159,.152,.062,.312,.091,.469,.091,.333,0,.659-.134,.901-.386l4.445-4.64c.527-.55,.527-1.411,0-1.961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsBoldOppositeDirection;
