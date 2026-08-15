package android.net;

import java.util.Collections;
import java.util.List;

public class MockUri extends Uri {
    private final String scheme;
    private final String authority;
    private final String lastPathSegment;

    public MockUri(String scheme, String authority, String lastPathSegment) {
        this.scheme = scheme;
        this.authority = authority;
        this.lastPathSegment = lastPathSegment;
    }

    @Override
    public boolean isHierarchical() { return true; }
    @Override
    public boolean isOpaque() { return false; }
    @Override
    public boolean isRelative() { return false; }
    @Override
    public boolean isAbsolute() { return true; }
    @Override
    public String getScheme() { return scheme; }
    @Override
    public String getSchemeSpecificPart() { return null; }
    @Override
    public String getEncodedSchemeSpecificPart() { return null; }
    @Override
    public String getAuthority() { return authority; }
    @Override
    public String getEncodedAuthority() { return authority; }
    @Override
    public String getUserInfo() { return null; }
    @Override
    public String getEncodedUserInfo() { return null; }
    @Override
    public String getHost() { return authority; }
    @Override
    public int getPort() { return -1; }
    @Override
    public String getPath() { return lastPathSegment != null ? "/" + lastPathSegment : null; }
    @Override
    public String getEncodedPath() { return getPath(); }
    @Override
    public String getQuery() { return null; }
    @Override
    public String getEncodedQuery() { return null; }
    @Override
    public String getFragment() { return null; }
    @Override
    public String getEncodedFragment() { return null; }
    @Override
    public List<String> getPathSegments() { return Collections.emptyList(); }
    @Override
    public String getLastPathSegment() { return lastPathSegment; }
    @Override
    public Builder buildUpon() { return null; }
    @Override
    public int describeContents() { return 0; }
    @Override
    public void writeToParcel(android.os.Parcel dest, int flags) {}
    @Override
    public int compareTo(Uri other) { return 0; }
    @Override
    public String toString() { return (scheme != null ? scheme + "://" : "") + (authority != null ? authority : "") + "/" + (lastPathSegment != null ? lastPathSegment : ""); }
}
