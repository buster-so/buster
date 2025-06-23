import type { iconProps } from './iconProps';

function bookmarkCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bookmark check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1H5.75c-1.517,0-2.75,1.233-2.75,2.75v12.5c0,.276,.152,.531,.396,.661,.242,.13,.54,.116,.77-.037l4.834-3.223,4.834,3.223c.126,.083,.271,.126,.416,.126,.121,0,.243-.029,.354-.089,.244-.13,.396-.385,.396-.661V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-.148,4.452l-3.397,4.5c-.128,.169-.322,.277-.533,.295-.022,.002-.044,.003-.065,.003-.189,0-.372-.071-.512-.202l-1.608-1.5c-.303-.282-.319-.757-.037-1.06,.285-.303,.759-.318,1.061-.037l1,.932,2.896-3.836c.249-.33,.718-.397,1.051-.146,.33,.25,.396,.72,.146,1.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bookmarkCheck;
