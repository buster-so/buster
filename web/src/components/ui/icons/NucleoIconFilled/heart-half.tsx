import type { iconProps } from './iconProps';

function heartHalf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart half';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.164,2c-1.195,.015-2.324,.491-3.164,1.306-.841-.815-1.972-1.291-3.179-1.306-2.529,.015-4.581,2.084-4.571,4.609,0,5.254,5.307,8.43,6.933,9.278,.256,.134,.537,.201,.817,.201s.562-.067,.817-.201c1.626-.848,6.933-4.023,6.933-9.275,.01-2.528-2.042-4.597-4.586-4.612Zm-3.041,12.557c-.04,.021-.082,.031-.123,.031V5.199c.242,0,.484-.104,.623-.312,.573-.855,1.53-1.375,2.546-1.387,1.705,.01,3.087,1.404,3.081,3.109,0,4.411-4.688,7.198-6.127,7.948Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heartHalf;
