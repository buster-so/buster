import type { iconProps } from './iconProps';

function userDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path d="M13,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path d="M10,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M7.5,15c0-1.378,1.121-2.5,2.5-2.5,.565,0,1.081,.195,1.5,.513,.419-.317,.935-.513,1.5-.513s1.081,.195,1.5,.513c.191-.144,.4-.261,.627-.347-1.217-2.238-3.554-3.666-6.127-3.666-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.456,.459,2.96,.703,4.479,.75-.599-.457-.992-1.171-.992-1.98Z"
          fill="currentColor"
        />
        <path d="M16,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default userDots;
