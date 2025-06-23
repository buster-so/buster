import type { iconProps } from './iconProps';

function pinTack2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin tack 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.081,15.669c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l3.329-3.329c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-3.329,3.329c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M15.498,4.77l-2.268-2.268c-1.039-1.039-2.85-1.039-3.889,0l-2.799,2.799c-.531,.034-1.057,.119-1.568,.254-1.083,.285-2.087,.783-2.986,1.48-.17,.132-.275,.331-.289,.546-.014,.215,.066,.425,.218,.577l7.924,7.924c.141,.141,.332,.22,.53,.22,.016,0,.031,0,.047-.001,.215-.014,.414-.119,.546-.289,.697-.899,1.196-1.904,1.481-2.986,.134-.511,.219-1.037,.253-1.568l2.799-2.799c.52-.52,.806-1.21,.806-1.944s-.286-1.425-.806-1.945Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pinTack2;
