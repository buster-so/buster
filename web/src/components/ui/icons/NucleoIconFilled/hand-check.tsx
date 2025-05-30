import type { iconProps } from './iconProps';

function handCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.7,8.422c-.116,0-.233-.027-.344-.084-.368-.191-.512-.644-.321-1.011,.309-.595,.465-1.209,.465-1.827,0-2.206-1.794-4-4-4s-4,1.794-4,4c0,.039,.008,.077,.013,.114,.009,.064,.017,.128,.021,.193,.03,.413-.281,.772-.694,.802-.387,.04-.771-.281-.802-.694-.026-.203-.038-.307-.038-.416C6,2.467,8.468,0,11.5,0s5.5,2.467,5.5,5.5c0,.86-.213,1.707-.633,2.517-.134,.257-.396,.405-.667,.405Z"
          fill="currentColor"
        />
        <path
          d="M11,8c-.198,0-.389-.078-.53-.22l-1.5-1.5c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.842,.842,1.747-2.717c.224-.348,.688-.449,1.036-.225,.349,.224,.449,.688,.226,1.037l-2.25,3.5c-.123,.19-.325,.316-.551,.34-.026,.003-.054,.004-.08,.004Z"
          fill="currentColor"
        />
        <path
          d="M17.808,10.69c-.491-1.087-1.774-1.575-2.862-1.083l-3.002,1.355c-.02-.175-.054-.349-.118-.519-.203-.541-.605-.971-1.13-1.209l-2.782-1.271c-1.185-.528-2.424-.518-3.492,.03-.472,.242-.875,.591-1.218,.992-.314-.299-.737-.486-1.204-.486h-.25C.785,8.5,0,9.285,0,10.25v5C0,16.215,.785,17,1.75,17h.25c.831,0,1.526-.584,1.703-1.363l3.547,1.134c.373,.12,.759,.179,1.143,.179,.527,0,1.053-.111,1.542-.333l6.791-3.065c1.088-.491,1.573-1.775,1.082-2.863Zm-1.352,1.125c-.062,.166-.186,.298-.348,.371l-6.791,3.065c-.508,.229-1.079,.263-1.61,.092l-3.957-1.265v-2.973c.172-.753,.684-1.432,1.356-1.776,.666-.341,1.424-.338,2.19,.002l2.778,1.269c.161,.073,.284,.205,.347,.371s.057,.347-.017,.509c-.073,.161-.205,.284-.371,.347-.166,.062-.347,.057-.509-.017l-1.971-.895c-.374-.169-.821-.004-.992,.373-.172,.377-.005,.822,.373,.993l1.971,.895c.285,.129,.589,.194,.893,.194,.257,0,.515-.046,.763-.139,.053-.02,5.001-2.256,5.001-2.256,.333-.151,.729,0,.878,.333,.073,.162,.079,.342,.016,.508Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default handCheck;
