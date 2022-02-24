import React, { forwardRef, Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import avatarBodyIcon from "../../resources/images/avatar/avatar.svgi";
import eyes1 from "../../resources/images/avatar/eyes-1.svg";
import eyes2 from "../../resources/images/avatar/eyes-1.svg";
import eyes3 from "../../resources/images/avatar/eyes-1.svg";
import eyes4 from "../../resources/images/avatar/eyes-1.svg";
import eyes5 from "../../resources/images/avatar/eyes-1.svg";
import eyes6 from "../../resources/images/avatar/eyes-2.svg";
import eyes7 from "../../resources/images/avatar/eyes-3.svg";
import eyes8 from "../../resources/images/avatar/eyes-4.svg";
import viseme1 from "../../resources/images/avatar/viseme-0.svg";
import viseme2 from "../../resources/images/avatar/viseme-1.svg";
import viseme3 from "../../resources/images/avatar/viseme-2.svg";
import viseme4 from "../../resources/images/avatar/viseme-3.svg";
import viseme5 from "../../resources/images/avatar/viseme-4.svg";
import viseme6 from "../../resources/images/avatar/viseme-5.svg";
import viseme7 from "../../resources/images/avatar/viseme-6.svg";
import viseme8 from "../../resources/images/avatar/viseme-7.svg";
import viseme9 from "../../resources/images/avatar/viseme-8.svg";
import viseme10 from "../../resources/images/avatar/viseme-9.svg";
import viseme11 from "../../resources/images/avatar/viseme-10.svg";
import viseme12 from "../../resources/images/avatar/viseme-11.svg";
import viseme13 from "../../resources/images/avatar/viseme-12.svg";

const AvatarSwatchEyeSrcs = [
  eyes1,
  eyes2,
  eyes3,
  eyes4,
  eyes5,
  eyes6,
  eyes7,
  eyes8,
];
const AvatarSwatchVisemeSrcs = [
  viseme1,
  viseme2,
  viseme3,
  viseme4,
  viseme5,
  viseme6,
  viseme7,
  viseme8,
  viseme9,
  viseme10,
  viseme11,
  viseme12,
  viseme13,
];

const AvatarBody = () => (
  <div className={classNames("avatar-body")} key="body" />
);

const AvatarSwatch = forwardRef((props, ref) => {
  const eyes = [];
  for (let i = 0; i < AvatarSwatchEyeSrcs.length; i++) {
    eyes.push(
      <img
        className={classNames("avatar-eyes", `eyes-${i}`)}
        key={`eyes-${i}`}
        src={AvatarSwatchEyeSrcs[i]}
      />
    );
  }

  const mouths = [];
  for (let i = 0; i < AvatarSwatchVisemeSrcs.length; i++) {
    mouths.push(
      <img
        className={classNames("avatar-mouth", `mouth-${i}`)}
        key={`mouth-${i}`}
        src={AvatarSwatchVisemeSrcs[i]}
      />
    );
  }

  return (
    <div className={classNames("avatar-swatch")} ref={ref} {...props}>
      <AvatarBody />
      {eyes}
      {mouths}
    </div>
  );
});

AvatarSwatch.displayName = "AvatarSwatch";

AvatarSwatch.propTypes = {};

export default AvatarSwatch;
