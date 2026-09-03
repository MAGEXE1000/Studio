import React from 'react';
import { StageExportPdfView, type StageExportPdfViewProps } from '../export/StageExportPdfView';

export type StageRiderViewProps = StageExportPdfViewProps;

export const StageRiderView: React.FC<StageRiderViewProps> = (props) => {
  return <StageExportPdfView {...props} />;
};

export default StageRiderView;
