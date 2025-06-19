import type { iconProps } from './iconProps';

function userLongHairShirt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user long hair shirt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <ellipse
          cx="15.5"
          cy="10.5"
          fill="currentColor"
          rx=".866"
          ry="1.936"
          transform="rotate(-45 15.5 10.5)"
        />
        <path
          d="M9,11c2.481,0,4.5-2.019,4.5-4.5s-2.019-4.5-4.5-4.5-4.5,2.019-4.5,4.5,2.019,4.5,4.5,4.5Zm0-1.5c-1.594,0-2.89-1.253-2.982-2.825,1.241-.216,2.311-.935,2.982-1.947,.671,1.012,1.741,1.731,2.982,1.947-.093,1.571-1.388,2.825-2.982,2.825Z"
          fill="currentColor"
        />
        <path
          d="M10.885,12.23l-1.438,2.875c-.184,.369-.71,.369-.894,0l-1.438-2.875c-1.679,.407-3.195,1.349-4.315,2.727-.306,.376-.365,.883-.156,1.323,.212,.444,.647,.72,1.137,.72H14.219c.49,0,.925-.276,1.137-.72,.209-.44,.15-.947-.156-1.323-1.12-1.378-2.636-2.319-4.315-2.727Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userLongHairShirt;
