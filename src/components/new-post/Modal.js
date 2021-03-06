import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import ContentEditable from '../utils/content-editable/ContentEditable';
import moment from 'moment';
import { apiURL } from '../../context/constants';
import styles from './Modal.module.scss';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ref, uploadBytesResumable, getDownloadURL } from '@firebase/storage';
import { storage } from '../../firebase/config';
import { createBlog } from '../../actions/userAction';
import removeActions from '../utils/remove-accents/removeActions';
import { useSelector } from 'react-redux';
import { BlogContext } from '../../context/BlogContext';
import io from 'socket.io-client';

const socket = io.connect(apiURL);

const Modal = ({ blogContent }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const { setShowModal } = useContext(BlogContext);

  const titleDisplayRef = useRef();

  // Get city living
  const timezone = Intl.DateTimeFormat()
    .resolvedOptions()
    .timeZone.split('/')[1];

  const date = moment().add(1, 'hours').format('yyyy-MM-DDTHH:mm');

  const [preview, setPreview] = useState(null);
  const [isSchedule, setIsSchedule] = useState(false);
  const [schedule, setSchedule] = useState(date);
  const [allowRecommend, setAllowRecommend] = useState(true);
  const [titleDisplay, setTitleDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState(null);
  const [tag, setTag] = useState('');
  const [invalidTag, setInvalidTag] = useState(null);

  const LIMIT_TITLE_DISPLAY_LENGTH = '100';
  const LIMIT_DESCRIPTION_LENGTH = '160';

  const SHOW_HELP_NUMBER_TITLE_DISPLAY = 67;
  const SHOW_HELP_NUMBER_DESCRIPTION = 108;

  useEffect(() => {
    return () => preview && URL.revokeObjectURL(preview);
  }, [preview]);

  const onDrop = useCallback((acceptedFiles) => {
    const image = URL.createObjectURL(acceptedFiles[0]);
    setPreview(image);
    setImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
    name: 'image',
  });

  useEffect(() => {
    titleDisplayRef.current.innerText = blogContent.title;
  }, [blogContent.title]);

  const readingTime = (content) => {
    const WORDS_PER_MINUTE = 200; // People read 200 words/min https://infusion.media/content-marketing/how-to-calculate-reading-time/
    const SMALLEST_READING_TIME = 1;

    const wordCount = content.split(' ').length;
    const minute = Math.floor(wordCount / WORDS_PER_MINUTE);

    return minute <= SMALLEST_READING_TIME ? SMALLEST_READING_TIME : minute;
  };

  const uploadImageToStorage = () => {
    setLoading(true);
    if (image) {
      const storageRef = ref(storage, `uploads/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      return uploadTask.on(
        'state_changed',
        (snapshot) => {
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (err) => console.log(err),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            postBlog(url);
          } catch (error) {
            console.log(error.message);
            setLoading(false);
          }
        }
      );
    } else {
      postBlog();
    }
  };

  const postBlog = async (image) => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const blogData = {
        image,
        tags,
        schedule: isSchedule ? schedule : null,
        allowRecommend,
        description,
        title: blogContent.title,
        content: blogContent.content,
        readingTime: readingTime(blogContent.content),
        search: removeActions(
          titleDisplay.length === 0 ? blogContent.title : titleDisplay
        ),
        titleDisplay:
          titleDisplay.length === 0 ? blogContent.title : titleDisplay,
        isPopular: false,
        isVerified: user.isAdmin ? true : false,
        isPosted: true,
      };

      const res = await fetch(`${apiURL}/new-post`, {
        method: 'POST',
        body: JSON.stringify(blogData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      user.userId !== process.env.REACT_APP_ADMIN_ID && addNotification(data);
      dispatchAndNavigate(data);
      setShowModal(false);
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = async (data) => {
    try {
      await fetch(`${apiURL}/notification/new-notification`, {
        method: 'POST',
        body: JSON.stringify({
          description: '??ang ch??? ???????c x??t duy???t',
          slug: data.blog.slug,
          title: data.blog.title,
          image: data.blog.image,
          notifiedBy: data.blog.postedBy,
          sendFor: process.env.REACT_APP_ADMIN_ID,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const dispatchAndNavigate = (data) => {
    createBlog({ blogData: data.blog });
    navigate(
      !data.blog.schedule ? `/blog/${data.blog.slug}` : '/my-post/published'
    );
  };

  const addTag = (e) => {
    const isFullTagsSize = tags && tags.length === 5;
    if (isFullTagsSize) return;

    const isEnterPressed = e.keyCode === 13;
    if (isEnterPressed) {
      const isExistTagAlready = tags.includes(tag);
      if (isExistTagAlready) return setInvalidTag('B???n ???? th??m th??? n??y');

      const isValidTagAddInput = !tag.match(
        /[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/
      );
      if (!isValidTagAddInput)
        return setInvalidTag(
          'Th??? ch??? h??? tr??? ch??? c??i, s???, d???u c??ch v?? d???u g???ch ngang'
        );

      setInvalidTag(null);
      setTags((prev) => [...prev, tag.trim()]);
      setTag('');
    }
  };

  const removeTag = (tag) =>
    setTags((prev) => prev.filter((item) => item !== tag));

  return (
    <div className={styles.modal}>
      <div className={styles.close} onClick={() => setShowModal(false)}>
        x
      </div>
      <Row className={styles.wrapper}>
        <Col md={12} lg={6} xl={6} className={styles.colLeft}>
          <h3>Xem tr?????c</h3>
          <form
            {...getRootProps()}
            role="button"
            tabIndex="0"
            className={styles.postButtonThumb}
            style={preview && { backgroundImage: `url(${preview})` }}
          >
            <input
              type="file"
              accept="image/*"
              autoComplete="off"
              name="image"
              tabIndex="-1"
              hidden
              {...getInputProps()}
            />
            <p>
              Th??m m???t ???nh ?????i di???n h???p d???n s??? gi??p b??i vi???t c???a b???n cu???n h??t
              h??n v???i ?????c gi???.
            </p>
            <span>K??o th??? ???nh v??o ????y, ho???c b???m ????? ch???n ???nh</span>
          </form>
          <ContentEditable
            className={`${styles.contentEditable} ${styles.title}`}
            text={'Ti??u ????? khi tin ???????c hi???n th???'}
            onInput={(e) => setTitleDisplay(e.target.innerText)}
            maxLength={LIMIT_TITLE_DISPLAY_LENGTH}
            ref={titleDisplayRef}
          />
          {titleDisplay.length >= SHOW_HELP_NUMBER_TITLE_DISPLAY && (
            <div className={styles.help}>{`${titleDisplay.length}/100`}</div>
          )}
          <ContentEditable
            className={`${styles.contentEditable} ${styles.description}`}
            text={'M?? t??? khi tin ???????c hi???n th???'}
            onInput={(e) => setDescription(e.target.innerText)}
            maxLength={LIMIT_DESCRIPTION_LENGTH}
          />
          {description.length >= SHOW_HELP_NUMBER_DESCRIPTION && (
            <div className={styles.help}>{`${description.length}/160`}</div>
          )}
          <p className={styles.note}>
            <strong>L??u ??:</strong> Ch???nh s???a t???i ????y s??? thay ?????i c??ch b??i vi???t
            ???????c hi???n th??? t???i trang ch???, tin n???i b???t - Ch??? kh??ng ???nh h?????ng t???i
            n???i dung b??i vi???t c???a b???n.
          </p>
        </Col>
        <Col md={12} lg={6} xl={6} className={styles.colRight}>
          <span>
            Th??m t???i ??a 5 th??? ????? ?????c gi??? bi???t b??i vi???t c???a b???n n??i v??? ??i???u g??.
          </span>
          B???n ???? th??m th??? n??y
          <div
            className={
              invalidTag !== null
                ? `${styles.tagWrapper} ${styles.invalid}`
                : styles.tagWrapper
            }
          >
            {tags &&
              tags.map((tag) => (
                <div
                  key={tag}
                  id={`tag_${tag}`}
                  tabIndex={1}
                  className={styles.tagCard}
                >
                  <span>{tag}</span>
                  <button onClick={() => removeTag(tag)}>x</button>
                </div>
              ))}
            {(!tags || tags.length !== 5) && (
              <input
                type="text"
                placeholder={
                  tags && tags.length === 5
                    ? ''
                    : 'V?? d???: Front-end, ReactJS, UI, UX'
                }
                className={styles.tagsInput}
                disabled={tags && tags.length === 5}
                onKeyDown={addTag}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            )}
          </div>
          {invalidTag !== null && (
            <div className={styles.invalidText}>{invalidTag}</div>
          )}
          <form className={styles.allow}>
            <input
              type="checkbox"
              checked={allowRecommend}
              className={styles.checkMark}
              onChange={() => setAllowRecommend((prev) => !prev)}
            />
            <label>
              ????? xu???t b??i vi???t c???a b???n ?????n c??c ?????c gi??? quan t??m t???i n???i dung
              n??y.
            </label>
          </form>
          {isSchedule && (
            <form className={styles.schedule}>
              <label>Th???i gian xu???t b???n:</label>
              <input
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
              <div className={styles.help}>{timezone} time (GMT+7)</div>
              <p>
                B??i vi???t n??y s??? ???????c xu???t b???n t??? ?????ng theo th???i gian ???? l??n l???ch
                ph??a tr??n.
              </p>
            </form>
          )}
          <div className={styles.actions}>
            <button
              className={
                !loading
                  ? styles.postButton
                  : `${styles.postButton} ${styles.disabled}`
              }
              onClick={uploadImageToStorage}
            >
              {isSchedule ? 'L??n l???ch xu???t b???n' : 'Xu???t b???n ngay'}
              {loading && (
                <Spinner
                  animation="border"
                  size="sm"
                  style={{ marginLeft: 8, color: '#fff' }}
                />
              )}
            </button>
            <button
              className={styles.postScheduleButton}
              onClick={() => setIsSchedule((prev) => !prev)}
            >
              {!isSchedule ? 'L??n l???ch xu???t b???n' : 'H???y l??n l???ch'}
            </button>
          </div>
          <img
            width={200}
            src={
              'http://localhost:5000/f8-prod/blog_posts/250951029_2310653682405428_2097463697023468442_n.jpg'
            }
            alt=""
          />
        </Col>
      </Row>
    </div>
  );
};

export default Modal;
