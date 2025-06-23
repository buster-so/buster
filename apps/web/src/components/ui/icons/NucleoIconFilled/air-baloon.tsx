import type { iconProps } from './iconProps';

function airBaloon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px air baloon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="3" width="4" fill="currentColor" rx=".75" ry=".75" x="6" y="14" />
        <path
          d="M10.5,10.5c-1.654,0-3-1.346-3-3,0-1.182,.687-2.206,1.682-2.695,.39-1.245,1.376-2.224,2.62-2.616-1.021-.749-2.333-1.189-3.802-1.189C4.58,1,2,3.374,2,6.522c0,3.247,3.265,6.167,3.403,6.29,.137,.121,.314,.188,.497,.188h4.2c.183,0,.359-.067,.497-.188,.076-.067,1.087-.975,1.988-2.312h-2.084Z"
          fill="currentColor"
        />
        <path
          d="M15.452,5.52c-.224-1.151-1.235-2.02-2.452-2.02-1.381,0-2.5,1.119-2.5,2.5-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5h4.75c.966,0,1.75-.783,1.75-1.75,0-.897-.678-1.628-1.548-1.73Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default airBaloon;
