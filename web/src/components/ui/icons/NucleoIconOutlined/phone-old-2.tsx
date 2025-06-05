import type { iconProps } from './iconProps';

function phoneOld2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone old 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.407,15.207c-.096,.346-.372,.614-.72,.704-.71,.182-1.622,.339-2.687,.339-.684,0-1.629-.065-2.713-.346-.335-.087-.599-.354-.691-.687-.434-1.566-.846-3.69-.846-6.217,0-1.56,.157-3.727,.843-6.207,.096-.346,.372-.614,.72-.704,.71-.182,1.622-.339,2.687-.339,.684,0,1.629,.065,2.713,.346,.335,.087,.599,.354,.691,.687,.434,1.566,.846,3.69,.846,6.217,0,1.56-.157,3.727-.843,6.207Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 5.75H10.75V8.25H7.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,9c.199,.24,1.706,2,4.25,2,.312,0,2.629-.04,4.25-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.75" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="10.25" cy="13.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default phoneOld2;
