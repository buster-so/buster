import type { iconProps } from './iconProps';

function scribble(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scribble';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.55,16c-.392,0-.752-.139-1.047-.407-1.003-.907-.36-2.119,.064-2.921l.099-.187c.059-.113,.132-.244,.212-.388,.924-1.66,.836-2.014,.755-2.089-.052-.012-.612-.09-2.509,2.027-1.052,1.174-2.578,2.585-3.877,2.639-.496,.013-.911-.138-1.246-.454-1.426-1.345-.137-3.025,1.496-5.152,.226-.295,.465-.606,.712-.935,1.477-1.961,2.989-3.972,2.429-4.53-.389-.384-1.549,.457-2.031,.836-2.253,1.772-6.277,5.922-6.317,5.963-.289,.299-.763,.305-1.061,.017s-.306-.763-.018-1.06c.168-.173,4.137-4.265,6.468-6.099,.656-.516,2.65-2.086,4.019-.72,1.484,1.479-.093,3.576-2.276,6.477-.264,.35-.505,.665-.734,.963-1.339,1.745-2.076,2.751-1.656,3.148,.024,.022,.051,.051,.154,.046,.57-.023,1.679-.864,2.822-2.141,1.093-1.22,2.367-2.474,3.533-2.526,.437-.023,.812,.12,1.115,.402,1.129,1.051,.13,2.845-.467,3.917-.073,.131-.14,.249-.192,.351l-.104,.196c-.207,.392-.521,.982-.384,1.106,.324,0,.855-.427,1.163-.797,.264-.318,.736-.363,1.056-.1,.318,.264,.364,.734,.102,1.054-.175,.213-1.103,1.28-2.155,1.358-.042,.003-.083,.004-.124,.004Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scribble;
