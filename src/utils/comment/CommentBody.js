import { useContext, useState } from 'react'
import { apiURL } from '../../context/constants'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import CommentInputSecondary from './CommentInputSecondary'
import { timeSince } from '../../utils/format/index'
import consoleLog from '../../utils/console-log/consoleLog'
import styles from './CommentBody.module.scss'
import Tippy from '../tippy/Tippy'
import { CommentContext } from '../../context/CommentContext'
import { SocketContext } from '../../context/SocketContext'
import { ModalContext } from '../../context/ModalContext'
import { Dropdown } from 'react-bootstrap'
import likeemoji from '../../asset/images/likeemoji.png'

const CommentBody = ({ commentData, setCommentData, dataId, commentType }) => {
  const user = useSelector((state) => state.user)
  const { isEditing, canModifyComment } = useContext(CommentContext)
  const { current } = useContext(SocketContext).socket
  const { onShowError } = useContext(ModalContext)

  const [isCode, setIsCode] = useState(false)
  const [editCommentText, setEditCommentText] = useState('')
  const [copyCommentHasCodeById, setCopyCommentHasCodeById] = useState([])
  const [showExtendButton, setShowExtendButton] = useState([])
  const [activeComment, setActiveComment] = useState({ type: '', id: '' })

  const COMMENT_CONTENT_LENGTH_TO_SHOW_EXTEND = 350

  const filterById = (arr, id) => arr.filter((item) => item !== id)

  const isShowExtendButton = (commentId) => showExtendButton.includes(commentId)

  const deleteComment = async (commentId) => {
    const url = `${apiURL}/comment/${commentId}`
    const data = await deleteDeleteComment(url)

    setCommentData(data.comments)
  }

  const deleteDeleteComment = async (url) => {
    const token = Cookies.get('token')
    if (!token) return

    try {
      return (
        await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      ).json()
    } catch (error) {
      consoleLog(error.message)
      onShowError()
    }
  }

  const editComment = async (commentId) => {
    const url = `${apiURL}/comment/${commentId}`
    const data = await putEditComment(url)

    setCommentData(data.comments)
  }

  const putEditComment = async (url) => {
    const token = Cookies.get('token')
    if (!token) return

    try {
      return (
        await fetch(url, {
          method: 'PUT',
          body: JSON.stringify({
            content: editCommentText,
            isCode,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      ).json()
    } catch (error) {
      consoleLog(error.message)
      onShowError()
    } finally {
      setEditCommentText('')
      cancelInput()
      setIsCode(false)
    }
  }

  const copyComment = (commentId, commentContent) => {
    navigator.clipboard.writeText(commentContent)

    setCopyCommentHasCodeById((prev) => [...prev, commentId])

    const timer = setTimeout(() => {
      setCopyCommentHasCodeById([])
      clearTimeout(timer)
    }, 5000)
  }

  const extendCommentContent = (commentId) =>
    isShowExtendButton(commentId)
      ? setShowExtendButton((prev) => filterById(prev, commentId))
      : setShowExtendButton((prev) => [...prev, commentId])

  const styleCommentContent = (commentId, commentContent) => {
    const isShortComment =
      commentContent.length < COMMENT_CONTENT_LENGTH_TO_SHOW_EXTEND
    return isShortComment || isShowExtendButton(commentId)
      ? styles.commentContent
      : `${styles.commentContent} ${styles.extend}`
  }

  const cancelInput = () => setActiveComment({ type: '', id: '' })

  const likeAndUnlikeComment = async (
    commentId,
    commentPostedBy,
    commentLikes
  ) => {
    const isLiked = commentLikes.includes(user.userId)
    const url = isLiked
      ? `${apiURL}/comment/unlike/${dataId}/${commentId}`
      : `${apiURL}/comment/like/${dataId}/${commentId}`
    const data = await patchLikeOrUnlikeComment(url)

    setCommentData(data)

    const isCommentAuthorLike = commentPostedBy._id === user.userId
    if (current && !isLiked && !isCommentAuthorLike) {
      current.emit('like', {
        sender: user,
        postId: dataId,
        receiver: commentPostedBy,
        description: 'đã thích bình luận của bạn',
        notificationType: 'like',
        postType: commentType,
        createdAt: new Date(),
      })
    }
  }

  const patchLikeOrUnlikeComment = async (url) => {
    const token = Cookies.get('token')
    if (!token) return

    try {
      return (
        await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      ).json()
    } catch (error) {
      consoleLog(error.message)
      onShowError()
    }
  }

  return (
    <>
      {commentData.map((comment) => (
        <div key={comment._id}>
          <div className={styles.commentList}>
            <div className={styles.avatar}>
              <img
                src={comment.postedBy.photoURL}
                alt={`${comment.postedBy.fullName} ảnh đại diện`}
              />
            </div>
            <div className={styles.commentBody}>
              <div
                className={styleCommentContent(comment._id, comment.content)}
              >
                <div>
                  <h5>{comment.postedBy.fullName}</h5>
                  {!comment.isCode && <span>{comment.content}</span>}
                  {comment.isCode && (
                    <pre tabIndex={0}>
                      <div
                        className={styles.copyWrapper}
                        onClick={() =>
                          copyComment(comment._id, comment.content)
                        }
                      >
                        <button className={styles.copyButton}>
                          {!copyCommentHasCodeById.includes(comment._id)
                            ? 'Copy'
                            : 'Copied!'}
                        </button>
                      </div>
                      {comment.content}
                    </pre>
                  )}
                  {comment.content.length >
                    COMMENT_CONTENT_LENGTH_TO_SHOW_EXTEND && (
                    <div
                      className={styles.extendButton}
                      onClick={() => extendCommentContent(comment._id)}
                    >
                      <strong>
                        {!isShowExtendButton(comment._id)
                          ? 'Mở rộng'
                          : 'Thu nhỏ'}
                      </strong>
                      <i
                        className={
                          !isShowExtendButton(comment._id)
                            ? 'fa-solid fa-chevron-down'
                            : 'fa-solid fa-chevron-up'
                        }
                      ></i>
                    </div>
                  )}
                </div>
                {comment && comment.likes.length > 0 && (
                  <div className={styles.reactCounterWrapper}>
                    <div className={styles.reactCounterContainer}>
                      <div className={styles.count}>
                        {comment.likes.length}
                        <img alt="Like icon" src={likeemoji} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.commentAction}>
                <div className={styles.action}>
                  {user.isLoggedIn && (
                    <>
                      <span
                        className={styles.reactionButton}
                        onClick={() => {
                          likeAndUnlikeComment(
                            comment._id,
                            comment.postedBy,
                            comment.likes
                          )
                        }}
                      >
                        {comment.likes.includes(user.userId)
                          ? 'Bỏ thích'
                          : 'Thích'}
                      </span>
                      <span className={styles.dot}>.</span>
                    </>
                  )}

                  <span className={styles.createdAt}>
                    {timeSince(comment.createdAt)}
                  </span>
                  {user.isLoggedIn && comment.postedBy._id === user.userId && (
                    <>
                      <span className={styles.dot}>.</span>
                      <Tippy
                        button={
                          <i
                            className={`fa-solid fa-ellipsis ${styles.optionIcon}`}
                          ></i>
                        }
                        className={styles.optionWrapper}
                      >
                        {(canModifyComment(user.userId, comment.postedBy._id) ||
                          user.isAdmin) && (
                          <>
                            <Dropdown.Item
                              className={styles.optionItem}
                              onClick={() => {
                                setActiveComment({
                                  type: 'editing',
                                  id: comment._id,
                                })
                                setIsCode(false)
                              }}
                            >
                              <i className="fa-solid fa-pen"></i>
                              <span>Sửa bình luận</span>
                            </Dropdown.Item>
                            <Dropdown.Item
                              className={styles.optionItem}
                              onClick={() => deleteComment(comment._id)}
                            >
                              <i className="fa-solid fa-trash"></i>
                              <span>Xóa bình luận</span>
                            </Dropdown.Item>
                          </>
                        )}
                      </Tippy>
                    </>
                  )}
                </div>
              </div>

              {isEditing(activeComment, comment._id) && (
                <CommentInputSecondary
                  userPhotoURL={user.photoURL}
                  setIsCode={setIsCode}
                  isCode={isCode}
                  cancelInput={cancelInput}
                  buttonText={'Sửa'}
                  submitComment={() => editComment(comment._id)}
                  onInput={(e) => setEditCommentText(e.target.innerText)}
                  commentText={editCommentText}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default CommentBody