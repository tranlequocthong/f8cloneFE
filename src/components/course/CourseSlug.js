import React, { useEffect, useState, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'
import Header from '../main-layout/nav/Header'
import SideBar from '../main-layout/sidebar/SideBar'
import CourseDetail from './CourseDetail'
import CourseEnroll from './CourseEnroll'
import styles from './CourseSlug.module.scss'
import CurriculumOfCourse from './CurriculumOfCourse'
import PreviewCourse from './PreviewCourse'
import { apiURL } from '../../context/constants'
import MainButton from '../utils/button/MainButton'

const Footer = React.lazy(() => import('../main-layout/footer/Footer'))

const CourseSlug = () => {
  const location = useLocation()

  const [course, setCourse] = useState()
  const [hasRequire, setHasRequire] = useState(false)
  const [isShowVideoPreviewCourse, setIsShowVideoPreviewCourse] =
    useState(false)

  const showVideoPreviewCourse = () =>
    setIsShowVideoPreviewCourse((prev) => !prev)

  useEffect(() => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`${apiURL}${location.pathname}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        const hasRequireKnowledgeForThisCourse = data.require
        hasRequireKnowledgeForThisCourse && setHasRequire(true)
        setCourse(data)
        document.title = `${data.title} | by F8`
      } catch (error) {
        console.log(error.message)
      }
    })()

    return () => controller?.abort()
  }, [])

  return (
    <>
      <Header />
      <Row>
        <Col xs={0} sm={0} md={1} lg={1} xl={1}>
          <SideBar />
        </Col>
        <Col xs={12} sm={12} md={12} lg={11} xl={11}>
          <div className="withSidebarContent">
            <Row className={styles.wrapper}>
              <Col lg={12} xl={8}>
                <div className={styles.topHeading}>
                  <h3>{course ? course.title : ''}</h3>
                  <p>{course ? course.description : ''}</p>
                </div>
                <div className={styles.purchaseBadge}>
                  <h5>Mi???n ph??</h5>
                  <Link to={`/learning/${course ? course.slug : ''}`}>
                    <MainButton className={styles.button} primary={true}>
                      ????ng k?? h???c
                    </MainButton>
                  </Link>
                  <ul>
                    <li>
                      <i className={`${styles.icon} fa-solid fa-compass`}></i>
                      <span>Tr??nh ????? {course ? course.level : ''}</span>
                    </li>
                    <li>
                      <i className={`${styles.icon} fa-solid fa-film`} />
                      <span>
                        T???ng s??? <strong>10</strong> b??i h???c
                      </span>
                    </li>
                    <li>
                      <i className={`${styles.icon} fa-solid fa-clock`}></i>
                      <span>
                        Th???i l?????ng <strong>03 gi??? 25 ph??t</strong>
                      </span>
                    </li>
                    <li>
                      <i className={`${styles.icon} fa-solid fa-clock`}></i>
                      <span>H???c m???i l??c, m???i n??i</span>
                    </li>
                  </ul>
                </div>
                <CourseDetail
                  topicList={course ? course.topicList : []}
                  title={'B???n s??? h???c ???????c g???'}
                />
                <CurriculumOfCourse
                  episodeList={course ? course.episode : []}
                />
                {hasRequire && (
                  <CourseDetail
                    topicList={course ? course.require : []}
                    title={'Y??u c???u'}
                  />
                )}
              </Col>
              <Col lg={12} xl={4}>
                <CourseEnroll
                  image={course ? course.image : ''}
                  showVideo={showVideoPreviewCourse}
                  slug={course ? course.slug : ''}
                />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <div className={styles.mobileButtonWrapper}>
        <Link to={`/learning/${course ? course.slug : ''}`}>
          <MainButton className={styles.mobileButton} primary={true}>
            ????NG K?? MI???N PH??
          </MainButton>
        </Link>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Footer />
      </Suspense>
      {isShowVideoPreviewCourse && (
        <PreviewCourse
          previewVideo={course.previewVideo}
          showVideo={showVideoPreviewCourse}
        />
      )}
    </>
  )
}

export default CourseSlug
