import type { iconProps } from './iconProps';

function award(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px award';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.643,12.133l.777-.652c.18-.151,.408-.234,.643-.234h1.014c.485,0,.901-.348,.985-.826l.176-.999c.041-.232,.162-.441,.342-.592l.777-.652c.372-.312,.466-.846,.223-1.266l-.507-.879c-.118-.204-.16-.442-.119-.674l.176-.999c.084-.478-.187-.947-.643-1.113l-.953-.347c-.221-.08-.406-.236-.524-.44l-.507-.879c-.243-.42-.752-.606-1.208-.44l-.953,.347c-.221,.08-.463,.08-.684,0l-.953-.347c-.456-.166-.965,.019-1.208,.44l-.507,.879c-.118,.204-.303,.359-.524,.44l-.953,.347c-.456,.166-.727,.635-.643,1.113l.176,.999c.041,.232-.001,.47-.119,.674l-.507,.879c-.243,.42-.149,.954,.223,1.266l.777,.652c.18,.151,.301,.361,.342,.592l.176,.999c.084,.478,.5,.826,.985,.826h1.014c.235,0,.463,.083,.643,.234l.777,.652c.372,.312,.914,.312,1.286,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 13.75L12.25 17.25 9 14.75 5.75 17.25 5.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="6.724"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default award;
