import * as React from 'react';
import { Artboard, Text, View, StyleSheet, Image, Svg } from 'react-sketchapp';

const styles = StyleSheet.create({
  slide: {
    width: 1024,
    height: 576, // 16:9 aspect ratio
    backgroundColor: '#FFFFFF',
    marginBottom: 50, // Space between slides in sketch
    overflow: 'hidden',
  },
  // Slide 1: Cover
  coverBackground: {
    flex: 1,
    backgroundColor: '#27AE60', // Nature Green
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 60,
    alignItems: 'center',
    borderRadius: 20,
  },
  coverTitle: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Arial',
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 32,
    color: '#ECF0F1',
    fontFamily: 'Arial',
  },

  // Slide 2: Content
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 60,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 40,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 48,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'Arial',
  },
  paragraph: {
    fontSize: 24,
    color: '#7F8C8D',
    lineHeight: 36,
    marginBottom: 20,
    fontFamily: 'Arial',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#E67E22', // Accent color
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Add drop shadow to test conversion
    shadowColor: 'rgba(0,0,0,1)',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  imageLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Slide 3: Data Chart
  chartContainer: {
    flex: 1,
    padding: 60,
    justifyContent: 'flex-end',
  },
  barsArea: {
    flexDirection: 'row',
    height: 300,
    alignItems: 'flex-end', // Align bars to bottom
    justifyContent: 'space-around',
    borderBottomWidth: 4,
    borderBottomColor: '#BDC3C7',
    paddingBottom: 10,
  },
  barGroup: {
    alignItems: 'center',
  },
  bar: {
    width: 80,
    backgroundColor: '#3498DB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 20,
    color: '#7F8C8D',
    fontWeight: 'bold',
  },
  barValue: {
    fontSize: 24,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginBottom: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 16,
    color: '#95A5A6',
  },
});

const ArtboardWrap = ({ genjsx }) => {
  return <Artboard>{genjsx}</Artboard>;
};

export default ArtboardWrap;
