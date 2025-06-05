import type { iconProps } from './iconProps';

function userDeveloper(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user developer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.953,14c1.298-1.958,3.522-3.25,6.047-3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.833,7.684c-.522,.357-1.153,.566-1.833,.566-1.795,0-3.25-1.455-3.25-3.25s1.455-3.25,3.25-3.25,3.25,1.455,3.25,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.925,16.25h-6.175l1.868-4.203c.08-.181,.259-.297,.457-.297h5.406c.362,0,.604,.372,.457,.703l-1.556,3.5c-.08,.181-.259,.297-.457,.297Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 16.25L5.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5,5l-3.961-.755c-.738-.141-1.466,.286-1.704,.999"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 8L0.75 9 2 10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.5 9L17.25 7.5 15.5 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="14.25" cy="2.25" fill="currentColor" r=".75" />
        <rect height="3" width="3" fill="currentColor" rx="1" ry="1" x="7" y="3.5" />
        <rect height="3" width="3" fill="currentColor" rx="1" ry="1" x="10.5" y="3.5" />
      </g>
    </svg>
  );
}

export default userDeveloper;
