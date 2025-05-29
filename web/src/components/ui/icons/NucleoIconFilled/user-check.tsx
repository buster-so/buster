import type { iconProps } from './iconProps';

function userCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M9.716,16.396c-.907-.847-.957-2.273-.112-3.18,.422-.454,1.022-.716,1.646-.716,.473,0,.927,.146,1.306,.417l1.389-1.84c-1.29-1.297-3.052-2.077-4.945-2.077-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.437,0,.873-.019,1.307-.053l-.591-.551Z"
          fill="currentColor"
        />
        <path
          d="M12.859,17c-.189,0-.372-.071-.512-.201l-1.609-1.5c-.303-.283-.319-.757-.037-1.06,.282-.304,.759-.319,1.061-.038l1,.933,2.896-3.836c.249-.33,.719-.397,1.051-.146,.33,.25,.396,.72,.146,1.051l-3.397,4.5c-.128,.169-.322,.276-.533,.295-.022,.002-.044,.003-.065,.003Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userCheck;
