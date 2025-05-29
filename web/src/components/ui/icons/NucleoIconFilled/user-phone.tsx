import type { iconProps } from './iconProps';

function userPhone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.517,10.775c-.04-.65,.157-1.27,.52-1.772-.012,0-.024-.003-.037-.003-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.911,0,1.817-.081,2.713-.23-1.822-1.41-3.042-3.556-3.196-5.995Z"
          fill="currentColor"
        />
        <path
          d="M17.235,13.5l-.859-.349c-.519-.229-1.129-.083-1.467,.34l-1.008,1.169c-.624-.404-1.157-.937-1.562-1.561l1.15-.992c.441-.354,.59-.963,.369-1.461l-.368-.903c-.248-.563-.866-.857-1.501-.69l-1.112,.365c-.543,.179-.899,.697-.864,1.262,.213,3.382,2.924,6.093,6.307,6.306,.025,.001,.052,.002,.077,.002,.533,0,1.014-.348,1.185-.867l.378-1.156c.155-.595-.141-1.208-.725-1.466Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userPhone;
