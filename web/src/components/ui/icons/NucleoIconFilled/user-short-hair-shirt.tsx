import type { iconProps } from './iconProps';

function userShortHairShirt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair shirt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11c2.481,0,4.5-2.019,4.5-4.5s-2.019-4.5-4.5-4.5-4.5,2.019-4.5,4.5,2.019,4.5,4.5,4.5Zm0-1.5c-1.654,0-3-1.346-3-3,0-.018,.005-.034,.005-.052,.244,.033,.492,.052,.745,.052,1.775,0,3.356-.808,4.41-2.073,.518,.54,.84,1.268,.84,2.073,0,1.654-1.346,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M15.2,14.957c-1.12-1.378-2.636-2.319-4.315-2.727l-1.438,2.875c-.184,.369-.71,.369-.894,0l-1.438-2.875c-1.679,.407-3.195,1.349-4.315,2.727-.306,.376-.365,.883-.156,1.323,.212,.444,.647,.72,1.137,.72H14.219c.49,0,.925-.276,1.137-.72,.209-.44,.15-.947-.156-1.323Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userShortHairShirt;
