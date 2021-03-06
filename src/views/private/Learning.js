import React, { useContext, useState, useEffect } from 'react'
import LearningActionBar from '../../components/learning/LearningActionBar'
import LearningContent from '../../components/learning/LearningContent'
import LearningHeader from '../../components/learning/LearningHeader'
import LearningTrack from '../../components/learning/LearningTrack'
import Comment from '../../components/utils/comment/Comment'
import { apiURL } from '../../context/constants'
import { LearningContext } from '../../context/LearningContext'
import styles from './Learning.module.scss'

const Learning = () => {
  const { isShowMenuTrack, handleIsShowMenuTrack, course, loading } =
    useContext(LearningContext)

  return (
    <>
      <LearningHeader />
      <LearningContent isShowMenuTrack={isShowMenuTrack} />
      {isShowMenuTrack && <LearningTrack loading={loading} />}

      <LearningActionBar
        handleIsShowMenuTrack={handleIsShowMenuTrack}
        isShowMenuTrack={isShowMenuTrack}
        loading={loading}
      />
    </>
  )
}

export default Learning
