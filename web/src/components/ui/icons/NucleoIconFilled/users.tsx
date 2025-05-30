import type { iconProps } from './iconProps';

function users(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.75" cy="6.25" fill="currentColor" r="2.75" />
        <circle cx="12" cy="3.75" fill="currentColor" r="2.75" />
        <path
          d="M17.196,11.098c-.811-2.152-2.899-3.598-5.196-3.598-1.417,0-2.752,.553-3.759,1.48,1.854,.709,3.385,2.169,4.109,4.089,.112,.296,.162,.603,.182,.91,1.211-.05,2.409-.26,3.565-.646,.456-.152,.834-.487,1.041-.919,.2-.42,.221-.888,.059-1.316Z"
          fill="currentColor"
        />
        <path
          d="M10.946,13.598c-.811-2.152-2.899-3.598-5.196-3.598S1.365,11.446,.554,13.598c-.162,.429-.141,.896,.059,1.316,.206,.432,.585,.767,1.041,.919,1.325,.442,2.704,.667,4.096,.667s2.771-.225,4.096-.667c.456-.152,.834-.487,1.041-.919,.2-.42,.221-.888,.059-1.316Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default users;
