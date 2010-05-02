exports.style = '<style>                                                  \n\
  .fb_button_simple, \n\
  .fb_button_simple_rtl { \n\
    background-image: url(http://static.ak.fbcdn.net/images/connect_favicon.png); \n\
    background-repeat: no-repeat; \n\
    cursor: pointer; \n\
    outline: none; \n\
    text-decoration: none; \n\
  } \n\
  .fb_button_simple_rtl { \n\
   background-position: right 0px; \n\
  } \n\
   \n\
  .fb_button_simple .fb_button_text { \n\
    margin: 0 0 0px 20px; \n\
    padding-bottom: 1px; \n\
  } \n\
   \n\
  .fb_button_simple_rtl .fb_button_text { \n\
    margin: 0px 10px 0px 0px; \n\
  } \n\
   \n\
  a.fb_button_simple:hover .fb_button_text, \n\
  a.fb_button_simple_rtl:hover .fb_button_text, \n\
  .fb_button_simple:hover .fb_button_text, \n\
  .fb_button_simple_rtl:hover .fb_button_text  { \n\
    text-decoration: underline; \n\
  } \n\
   \n\
   \n\
  .fb_button, \n\
  .fb_button_rtl { \n\
    background: #29447e url(http://static.ak.fbcdn.net/images/connect_sprite.png); \n\
    background-repeat: no-repeat; \n\
    cursor: pointer; \n\
    display: inline-block; \n\
    padding: 0px 0px 0px 1px; \n\
    text-decoration: none; \n\
    outline: none; \n\
  } \n\
   \n\
  .fb_button .fb_button_text, \n\
  .fb_button_rtl .fb_button_text { \n\
    background: #5f78ab url(http://static.ak.fbcdn.net/images/connect_sprite.png); \n\
    border-top: solid 1px #879ac0; \n\
    border-bottom: solid 1px #1a356e; \n\
    color: white; \n\
    display: block; \n\
    font-family: "lucida grande",tahoma,verdana,arial,sans-serif; \n\
    font-weight: bold; \n\
    padding: 2px 6px 3px 6px; \n\
    margin: 1px 1px 0px 21px; \n\
    text-shadow: none; \n\
  } \n\
   \n\
   \n\
  a.fb_button, \n\
  a.fb_button_rtl, \n\
  .fb_button, \n\
  .fb_button_rtl { \n\
    text-decoration: none; \n\
  } \n\
   \n\
  a.fb_button:active .fb_button_text, \n\
  a.fb_button_rtl:active .fb_button_text, \n\
  .fb_button:active .fb_button_text, \n\
  .fb_button_rtl:active .fb_button_text { \n\
    border-bottom: solid 1px #29447e; \n\
    border-top: solid 1px #45619d; \n\
    background: #4f6aa3; \n\
    text-shadow: none; \n\
  } \n\
   \n\
   \n\
  .fb_button_xlarge, \n\
  .fb_button_xlarge_rtl { \n\
    background-position: left -60px; \n\
    font-size: 24px; \n\
    line-height: 30px; \n\
  } \n\
  .fb_button_xlarge .fb_button_text { \n\
    padding: 3px 8px 3px 12px; \n\
    margin-left: 38px; \n\
  } \n\
  a.fb_button_xlarge:active { \n\
    background-position: left -99px; \n\
  } \n\
  .fb_button_xlarge_rtl { \n\
    background-position: right -268px; \n\
  } \n\
  .fb_button_xlarge_rtl .fb_button_text { \n\
    padding: 3px 8px 3px 12px; \n\
    margin-right: 39px; \n\
  } \n\
  a.fb_button_xlarge_rtl:active { \n\
    background-position: right -307px; \n\
  } \n\
   \n\
  .fb_button_large, \n\
  .fb_button_large_rtl { \n\
    background-position: left -138px; \n\
    font-size: 13px; \n\
    line-height: 16px; \n\
  } \n\
  .fb_button_large .fb_button_text { \n\
    margin-left: 24px; \n\
    padding: 2px 6px 4px 6px; \n\
  } \n\
  a.fb_button_large:active { \n\
    background-position: left -163px; \n\
  } \n\
  .fb_button_large_rtl { \n\
    background-position: right -346px; \n\
  } \n\
  .fb_button_large_rtl .fb_button_text { \n\
    margin-right: 25px; \n\
  } \n\
  a.fb_button_large_rtl:active { \n\
    background-position: right -371px; \n\
  } \n\
   \n\
  .fb_button_medium, \n\
  .fb_button_medium_rtl  { \n\
    background-position: left -188px; \n\
    font-size: 11px; \n\
    line-height: 14px; \n\
  } \n\
  a.fb_button_medium:active  { \n\
    background-position: left -210px; \n\
  } \n\
   \n\
  .fb_button_medium_rtl  { \n\
    background-position: right -396px; \n\
  } \n\
  .fb_button_text_rtl, \n\
  .fb_button_medium_rtl .fb_button_text { \n\
    padding: 2px 6px 3px 6px; \n\
    margin-right: 22px; \n\
  } \n\
  a.fb_button_medium_rtl:active  { \n\
    background-position: right -418px; \n\
  } \n\
  .fb_button_small, \n\
  .fb_button_small_rtl { \n\
    background-position: left -232px; \n\
    font-size: 10px; \n\
    line-height: 10px; \n\
  } \n\
  .fb_button_small .fb_button_text { \n\
    padding: 2px 6px 3px; \n\
    margin-left: 17px; \n\
  } \n\
  a.fb_button_small:active, \n\
  .fb_button_small:active { \n\
    background-position: left -250px; \n\
  } \n\
   \n\
  .fb_button_small_rtl { \n\
    background-position: right -440px; \n\
  } \n\
  .fb_button_small_rtl .fb_button_text { \n\
    padding: 2px 6px; \n\
    margin-right: 18px; \n\
  } \n\
  a.fb_button_small_rtl:active { \n\
    background-position: right -458px; \n\
  } \n\
  </style> \n\
  '